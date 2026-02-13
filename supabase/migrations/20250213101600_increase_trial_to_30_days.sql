-- Migration: Increase trial period from 3 days to 30 days
-- This updates the register_telegram_user function to give new users 30 days of trial access

CREATE OR REPLACE FUNCTION register_telegram_user(
  p_telegram_id BIGINT,
  p_username TEXT DEFAULT NULL,
  p_display_name TEXT DEFAULT NULL,
  p_referral_code TEXT DEFAULT NULL
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_user_id UUID;
  v_existing_user RECORD;
  v_referral_code TEXT;
  v_trial_ends_at TIMESTAMPTZ;
  v_status TEXT;
BEGIN
  -- Check if user already exists
  SELECT id, tier, status, trial_ends_at, referral_code
  INTO v_existing_user
  FROM users
  WHERE telegram_id = p_telegram_id;

  IF v_existing_user.id IS NOT NULL THEN
    -- Update last_login_at and return existing user info
    UPDATE users
    SET last_login_at = NOW()
    WHERE id = v_existing_user.id;

    RETURN jsonb_build_object(
      'user_id', v_existing_user.id,
      'tier', v_existing_user.tier,
      'status', v_existing_user.status,
      'trial_ends_at', v_existing_user.trial_ends_at,
      'referral_code', v_existing_user.referral_code,
      'status', 'existing'
    );
  END IF;

  -- Generate unique referral code for new user
  v_referral_code := substr(md5(random()::text || p_telegram_id::text), 1, 8);

  -- Set trial to end 30 days from now (changed from 3 days)
  v_trial_ends_at := NOW() + INTERVAL '30 days';
  v_status := 'trial';

  -- Insert new user
  INSERT INTO users (
    telegram_id,
    telegram_username,
    display_name,
    tier,
    status,
    trial_ends_at,
    referral_code,
    created_at,
    last_login_at
  ) VALUES (
    p_telegram_id,
    p_username,
    p_display_name,
    'trial',
    v_status,
    v_trial_ends_at,
    v_referral_code,
    NOW(),
    NOW()
  )
  RETURNING id INTO v_user_id;

  -- Create user quota record
  INSERT INTO user_quotas (user_id)
  VALUES (v_user_id)
  ON CONFLICT (user_id) DO NOTHING;

  -- If referral code provided, create referral record
  IF p_referral_code IS NOT NULL AND p_referral_code != '' THEN
    INSERT INTO referrals (
      referrer_id,
      referred_id,
      referrer_credit,
      referred_credit,
      status
    )
    SELECT
      u.id,
      v_user_id,
      1.80,  -- referrer gets $1.80 credit
      1.20,  -- referred gets $1.20 credit
      'pending'
    FROM users u
    WHERE u.referral_code = p_referral_code
    AND u.id != v_user_id
    ON CONFLICT DO NOTHING;
  END IF;

  -- Log the registration
  INSERT INTO usage_events (user_id, event_type, metadata)
  VALUES (v_user_id, 'user_registered', jsonb_build_object(
    'telegram_id', p_telegram_id,
    'referral_code_used', p_referral_code,
    'trial_ends_at', v_trial_ends_at
  ));

  RETURN jsonb_build_object(
    'user_id', v_user_id,
    'tier', 'trial',
    'status', v_status,
    'trial_ends_at', v_trial_ends_at,
    'referral_code', v_referral_code,
    'status', 'created'
  );
END;
$$;

-- Grant execute permission to authenticated and service_role
GRANT EXECUTE ON FUNCTION register_telegram_user(BIGINT, TEXT, TEXT, TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION register_telegram_user(BIGINT, TEXT, TEXT, TEXT) TO service_role;

COMMENT ON FUNCTION register_telegram_user IS 'Registers a new Telegram user with 30-day trial access (upgraded from 3 days)';

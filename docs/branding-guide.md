# 🏗️ OPENCLAW vs OPENJOEY - BRANDING GUIDE

## 📋 **OVERVIEW**

This document clarifies the branding strategy and relationship between OpenClaw and OpenJoey components.

---

## 🎯 **BRANDING STRATEGY**

### **Two Brands, One Ecosystem**

| Component                | Brand Name   | Target Audience   | Purpose                          |
| ------------------------ | ------------ | ----------------- | -------------------------------- |
| **AI Trading Assistant** | **OpenJoey** | End Users         | Trading bot users interact with  |
| **Infrastructure Layer** | **OpenClaw** | Developers/DevOps | System that powers AI assistants |

### **User-Facing Brand**

- **OpenJoey** - What users see and interact with
- Telegram bot: @OpenJoey_bot
- Admin dashboard: OpenJoey Admin
- Trading features: OpenJoey V1, V2, V3

### **Infrastructure Brand**

- **OpenClaw** - What runs behind the scenes
- CLI tool: `openclaw`
- Docker images: `openclaw:local`
- Server processes: `openclaw-gateway`

---

## 🔄 **RELATIONSHIP DIAGRAM**

```
┌─────────────────────────────────────────────────────────────┐
│                USERS                                │
│  @OpenJoey_bot  │  OpenJoey Admin Dashboard    │
└─────────────────┬───────────────────────────────────────┘
                  │
┌─────────────────▼───────────────────────────────────────┐
│              OPENCLAW INFRASTRUCTURE             │
│  ┌─────────────┐  ┌─────────────────┐   │
│  │   Gateway   │  │    CLI Tool    │   │
│  │ openclaw-   │  │   openclaw     │   │
│  │ gateway     │  │   command      │   │
│  └─────────────┘  └─────────────────┘   │
│         │                   │            │
│         ▼                   ▼            │
│  ┌─────────────────────────────────┐   │
│  │     OPENJOEY V1           │   │
│  │  Trading Assistant          │   │
│  │  (AI Bot)                 │   │
│  └─────────────────────────────────┘   │
└─────────────────────────────────────────────┘
```

---

## 🎯 **BRANDING RULES**

### **When to Use "OpenJoey"**

- ✅ Referring to the AI trading assistant
- ✅ User-facing features and documentation
- ✅ Telegram bot interactions
- ✅ Trading capabilities and analysis
- ✅ Admin dashboard and user management

### **When to Use "OpenClaw"**

- ✅ Infrastructure and deployment
- ✅ CLI commands and tooling
- ✅ Docker images and containers
- ✅ Server management and monitoring
- ✅ Developer documentation

### **Combined References**

- ✅ "OpenJoey powered by OpenClaw infrastructure"
- ✅ "Deploy OpenJoey V1 using OpenClaw"
- ✅ "OpenClaw gateway running OpenJoey services"

---

## 📈 **EVOLUTION PATH**

### **Phase 1: Documentation Clarity** ✅ CURRENT

- Update all docs to clarify branding separation
- Add branding guide to repository
- Create consistent terminology

### **Phase 2: CLI Enhancement** (Future)

- Create `openjoey` CLI alias for user-facing commands
- Keep `openclaw` for infrastructure management
- Gradual migration path

### **Phase 3: Unified Branding** (Future)

- Consider renaming infrastructure components
- Maintain backward compatibility
- Update deployment scripts

---

## 🎨 **LOGO AND VISUALS**

### **OpenJoey Brand**

- 🎯 **Logo:** Target/scope symbol
- 🌊 **Colors:** Blue/trading theme
- 🤖 **Personality:** Smart trading assistant

### **OpenClaw Brand**

- 🦾 **Logo:** Claw/grip symbol
- ⚙️ **Colors:** Technical/infrastructure theme
- 🔧 **Personality:** Reliable infrastructure

---

## 💡 **KEY TAKEAWAYS**

1. **OpenJoey = Product** (what users pay for)
2. **OpenClaw = Infrastructure** (what powers the product)
3. **Both work together** in one ecosystem
4. **Clear separation** helps with marketing and documentation
5. **Unified ecosystem** provides complete solution

**Remember:** Users buy OpenJoey, developers use OpenClaw! 🚀

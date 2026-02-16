interface GridProps {
  children: React.ReactNode;
  cols?: number;
  gap?: string;
}

export function Grid({ children, cols = 4, gap = "20px" }: GridProps) {
  return (
    <section
      style={{
        display: "grid",
        gridTemplateColumns: `repeat(auto-fit, minmax(${cols === 4 ? "200px" : "300px"}, 1fr))`,
        gap,
      }}
    >
      {children}
    </section>
  );
}

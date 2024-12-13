type GameGridProps = {
  rows: number;
  columns: number;
  pattern: number[];
  selectedPattern: number[];
  onCellClick: (index: number) => void;
  showPattern: boolean;
};

const GameGrid = ({
  rows,
  columns,
  pattern,
  selectedPattern,
  onCellClick,
  showPattern,
}: GameGridProps) => {
  const totalCells = rows * columns;

  return ( 
    <div
      className="grid gap-0 mt-4"
      style={{
        gridTemplateColumns: `repeat(${columns}, 1fr)`,
      }}
    >
      {Array.from({ length: totalCells }).map((_, index) => {
        const isPatternCell = showPattern && pattern.includes(index);
        const isSelected = selectedPattern.includes(index);

        return (
          <div
            key={index}
            className={`h-16 w-16 border border-black rounded ${
              isPatternCell ? 'bg-pink-300' : isSelected ? 'bg-pink-500' : 'bg-[#e9d4e5]'
            }`}
            onClick={() => !showPattern && onCellClick(index)}
          ></div>
        );
      })}
    </div>
  );
};

export default GameGrid;

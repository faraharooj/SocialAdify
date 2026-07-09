// D:\socialadify\frontend\src\components\FilterStats.tsx
import React from 'react';

interface FilterStatsProps {
  onFilterChange: React.Dispatch<React.SetStateAction<Record<string, number> | null>>;
}

const FilterStats: React.FC<FilterStatsProps> = ({ onFilterChange }) => {
  const handleFilterChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const newFilter = event.target.value;
    // Example of setting a filter
    onFilterChange({ [newFilter]: 0 });
  };

  return (
    <div>
      <input
        type="text"
        onChange={handleFilterChange}
        placeholder="Filter..."
      />
    </div>
  );
};

export default FilterStats;

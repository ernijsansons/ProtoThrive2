// Ref: CLAUDE.md Phase 2 - InsightsPanel with exact styling
import { useStore } from '../store';

const InsightsPanel = () => {
  console.log('Thermonuclear InsightsPanel Rendered');
  const { thriveScore } = useStore();

  return (
    <div className="p-4 bg-gray dark:bg-gray-800-800 rounded-lg sm:p-4 bg-gray dark:bg-gray-800-800 rounded-lg md:p-4 bg-gray dark:bg-gray-800-800 rounded-lg lg:p-4 bg-gray dark:bg-gray-800-800 rounded-lg">
      <h2 className="text-white sm:text-white md:text-white lg:text-white">Thrive Score</h2>
      <div 
        className="h-4 bg-gradient dark:bg-gray-800-to-r from-blue-500 to-orange-500 sm:h-4 bg-gradient dark:bg-gray-800-to-r from-blue-500 to-orange-500 md:h-4 bg-gradient dark:bg-gray-800-to-r from-blue-500 to-orange-500 lg:h-4 bg-gradient dark:bg-gray-800-to-r from-blue-500 to-orange-500" 
        style={{ width: `${thriveScore * 100}%` }}
      />
      <p className="text-white sm:text-white md:text-white lg:text-white">{thriveScore.toFixed(2)}</p>
    </div>
  );
};

export default React.memo(InsightsPanel);
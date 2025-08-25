// Ref: CLAUDE.md Phase 2 - InsightsPanel with exact styling
import { useStore } from '../store';

const InsightsPanel = () => {
  console.log('Thermonuclear InsightsPanel Rendered');
  const { thriveScore } = useStore();

  return (
    <div className="p-4 bg-gray-800 rounded-lg">
      <h2 className="text-white">Thrive Score</h2>
      <div 
        className="h-4 bg-gradient-to-r from-blue-500 to-orange-500" 
        style={{ width: `${thriveScore * 100}%` }}
      />
      <p className="text-white">{thriveScore.toFixed(2)}</p>
    </div>
  );
};

export default InsightsPanel;
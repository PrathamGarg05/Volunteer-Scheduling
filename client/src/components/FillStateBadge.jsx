const styles = {
    "Open": "bg-green-100 text-green-800",
    "Partially Filled": "bg-yellow-100 text-yellow-800",
    "Filled": "bg-blue-100 text-blue-800",
    "Closed": "bg-gray-200 text-gray-600",
  };
  
  export default function FillStateBadge({ status }) {
    return (
      <span className={`px-2 py-1 rounded-full text-xs font-medium ${styles[status]}`}>
        {status}
      </span>
    );
  }
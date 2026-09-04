import { exportRoster } from "../api/csv.api";

export default function RosterExportButton({ programId, programName }) {
  const handleExport = async () => {
    const res = await exportRoster(programId);

    // Build a temporary download link from the blob and click it programmatically —
    // this is the standard way to trigger a file save from a fetched response,
    // since browsers won't let JS directly write to disk.
    const url = window.URL.createObjectURL(new Blob([res.data]));
    const link = document.createElement("a");
    link.href = url;
    link.setAttribute("download", `roster-${programName.replace(/\s+/g, "-")}.csv`);
    document.body.appendChild(link);
    link.click();
    link.remove();
    window.URL.revokeObjectURL(url); // free the memory once the download is triggered
  };

  return (
    <button
      onClick={handleExport}
      className="text-sm border border-slate-300 rounded-lg px-3 py-1.5 hover:bg-slate-50 transition"
    >
      Export Roster CSV
    </button>
  );
}
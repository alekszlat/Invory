namespace Invory.Models.BDModels
{
    public class ChangeRequest
    {
        public int Id { get; set; }

        public int WorkspaceId { get; set; }
        public WorkSpace Workspace { get; set; }

        public int SubWorkspaceId { get; set; }
        public SubWorkSpace SubWorkspace { get; set; }

        public int AssetId { get; set; }
        public Asset Asset { get; set; }

        public string ChangeReuestType { get; set; }              // "present", "missing", "location", "disposal"
        public string Note { get; set; } = "";        // Забележка (задължителна при discrepancy/disposal)
        public string Location { get; set; } = "";    // Ново местоположение (при kind == location)

        // Снимка на състоянието към момента на подаване (за защита от промени)
        public string OriginalLocation { get; set; }
        public string OriginalStatus { get; set; }
        public int OriginalAssetVersion { get; set; }

        public string Status { get; set; } = "pending"; // "pending", "approved", "rejected"
        public string Reason { get; set; } = "";        // Причина при отхвърляне

        // Кой е подал заявката
        public int RequesterId { get; set; }
        public User Requester { get; set; }

        // Кой я е одобрил/отхвърлил (null докато е pending)
        public int? DecidedById { get; set; }
        public User? DecidedBy { get; set; }

        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
        public DateTime? DecidedAt { get; set; }
    }
}

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

        public string requestedBy { get; set; }
        public string ChangeReuestType { get; set; }              
        public string Note { get; set; } = "";        
        public string Location { get; set; } = "";    

        public string OriginalLocation { get; set; }
        public string OriginalStatus { get; set; }
        public int OriginalAssetVersion { get; set; }

        public string Status { get; set; } = "pending"; // "pending", "approved", "rejected"
        public string Reason { get; set; } = "";        // Причина при отхвърляне

        


        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
        public DateTime? DecidedAt { get; set; }
    }
}

using Invory.DTO;
using Invory.Models.enums;

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

        public int RequestedById { get; set; }
        public string RequestedByUsername { get; set; } = "";
        public string RequestedByEmail { get; set; } = "";


        public ChangeRequestKind ChangeReuestType { get; set; }              
        public string Note { get; set; } = "";        
        public string Location { get; set; } = "";    

        public string OriginalLocation { get; set; }
        public AssetStatus OriginalAssetStatus { get; set; }
        public int OriginalAssetVersion { get; set; }
 

        public ChangeRequestStatus Status { get; set; } = ChangeRequestStatus.pending; 
        public string Reason { get; set; } = "";       

        

        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
        public DateTime? DecidedAt { get; set; }
    }
}

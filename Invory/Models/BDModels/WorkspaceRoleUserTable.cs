using Invory.Models.HelperClasses;

namespace Invory.Models.BDModels
{
    public class WorkspaceRoleUserTable
    {
        public int UserId { get; set; }
        public User User { get; set; }

        public int WorkspaceId { get; set; }
        public WorkSpace Workspace { get; set; }


        public WorkspaceRole Role { get; set; }
    }
}

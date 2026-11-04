using Microsoft.AspNetCore.Identity;

namespace Invory.Models.BDModels
{
    public class User : IdentityUser<int>
    {

        public virtual List<WorkspaceRoleUserTable> WorkspaceRUTable { get; set; } = new List<WorkspaceRoleUserTable>();
        public virtual List<WorkSpace> Workspaces { get; set; } = new List<WorkSpace>();

        public virtual List<SubWorkSpace> SubWorkSpaces { get; set; } = new List<SubWorkSpace>();

    }
}

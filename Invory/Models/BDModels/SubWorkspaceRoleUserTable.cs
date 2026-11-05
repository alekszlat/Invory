
using Invory.Models.enums;

namespace Invory.Models.BDModels
{
    public class SubWorkspaceRoleUserTable
    {
        public int UserId { get; set; }
        public User User { get; set; }

        public int SubWorkSpaceId { get; set; }
        public SubWorkSpace subWorkSpace { get; set; }

        public SubWorkspaceRoles subWorkspaceRole { get; set; }

    }
}

using Invory.Models.BDModels;
using Invory.Models.enums;
using System.ComponentModel.DataAnnotations;

namespace Invory.Models
{
    public class SubWorkspaceInvitation:WorkspaceInvitation
    {
        public int SubWorkspaceId { get; set; }
        public SubWorkspaceRoles InvitedAsRole { get; set; }
    }
}

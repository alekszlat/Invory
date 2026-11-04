using System.ComponentModel.DataAnnotations;

namespace Invory.Models.BDModels
{
    public class WorkSpace
    {
        [Key]
        public int Id { get; set; }
        public string WorkspaceName { get; set; }


        public  List<WorkspaceRoleUserTable> WorkspaceRUTable { get; set; } = new List<WorkspaceRoleUserTable>();
        public List<User> Users { get; set; } = new List<User>();

        public List<Asset> Assets { get; set; } = new List<Asset>();
        public List<SubWorkSpace> SubWorkSpaces { get; set; } = new List<SubWorkSpace>();

    }
}

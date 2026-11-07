using System.ComponentModel.DataAnnotations;

namespace Invory.Models.BDModels
{
    public class WorkSpace
    {
        [Key]
        public int Id { get; set; }

        [Required]
        [MaxLength(100)]
        public string WorkspaceName { get; set; } 

        [MaxLength(300)]
        public string? Description { get; set; }


 
        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
        public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;

   
        public List<WorkspaceRoleUserTable> WorkspaceRUTable { get; set; } = new();
        public List<User> Users { get; set; } = new();
        public List<Asset> Assets { get; set; } = new();
        public List<SubWorkSpace> SubWorkSpaces { get; set; } = new();
    }
}

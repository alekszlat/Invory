using Invory.DTO;
using System.ComponentModel.DataAnnotations;

namespace Invory.Models.BDModels
{
    public class History
    {
        [Key]
        public int Id { get; set; }

        public int WorkspaceId { get; set; }
        public WorkSpace Workspace { get; set; }

        public int UserId { get; set; } = 0;
        public string UserUsername { get; set; } = string.Empty;
        public string UserEmail { get; set; } = string.Empty;

        public string Title { get; set; }= string.Empty;
        public string Description { get; set; }= string.Empty;
        public DateTime At { get; set; }= DateTime.UtcNow;


    }
}

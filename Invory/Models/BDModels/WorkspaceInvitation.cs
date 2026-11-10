namespace Invory.Models.BDModels
{
    public class WorkspaceInvitation
    {
        public int Id { get; set; }
        public int WorkspaceId { get; set; }
        public string Token { get; set; } 
        public DateTime ExpiresAt { get; set; }
        public DateTime CreatedAt { get; set; }

        public DateTime InvokedAt { get; set; }

        public bool IsUsed { get; set; } = false; 
    }
}

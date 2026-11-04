namespace Invory.Models.BDModels
{
    public class SubWorkSpace
    {
        public int Id { get; set; }

        public int WorkspaceId { get; set; }
        public WorkSpace Workspace { get; set; }

        public List<User> Users { get; set; } = new List<User>();
        public List<Asset> Assets { get; set; } = new List<Asset>();



    }
}

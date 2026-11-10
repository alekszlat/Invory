namespace Invory.DTO
{
    internal class CreatedSubWorkspaceDTO
    {
        private int id;
        private string subWorkspaceName;
        private int registerId;

        public CreatedSubWorkspaceDTO(int id, string subWorkspaceName, int registerId)
        {
            this.id = id;
            this.subWorkspaceName = subWorkspaceName;
            this.registerId = registerId;
        }
    }
}
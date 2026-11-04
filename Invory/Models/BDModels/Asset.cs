namespace Invory.Models.BDModels
{
    using Invory.Models.HelperClasses;
    public class Asset
    {
        public int Id { get; set; }
        public String AssetName { get; set; }
        public DateTime DateOfAcquisition { get; set; }
        public String Мeasurement { get; set; }
        public int Quantity { get; set; }
        public String Location { get; set; }
        public AssetStatus status { get; set; }



        public int WorkspaceId { get; set; }
        public WorkSpace Workspace { get; set; }

        //не винаги е във subworkspace
        public int ? SubWorkspaceId { get; set; }
        public SubWorkSpace SubWorkspace { get; set; }





    }
}

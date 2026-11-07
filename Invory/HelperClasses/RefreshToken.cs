using Invory.Models.BDModels;

namespace Invory.HelperClasses
{
    public class RefreshToken
    {
            public int Id { get; set; }
            public string Token { get; set; }
            public DateTime ExpireTime { get; set; }
            public int UserId { get; set; }

        //navigation property
            public User User { get; set; }  
    }
}

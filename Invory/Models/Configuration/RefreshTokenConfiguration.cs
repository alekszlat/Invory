using Invory.HelperClasses;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace Invory.Models.Configuration
{
    public class RefreshTokenConfiguration : IEntityTypeConfiguration<RefreshToken>
    {
        public void Configure(EntityTypeBuilder<RefreshToken> builder)
        {
            builder.HasKey(token => token.Id);
            builder.Property(token => token.Token).HasMaxLength(200);
            builder.HasIndex(token => token.Token).IsUnique();
            builder.HasOne(token => token.User); 

        }
    }
}

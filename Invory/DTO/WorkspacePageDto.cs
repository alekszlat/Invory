using Invory.Models.enums;

namespace Invory.DTO
{
    record class WorkspacePageDto(int Id, string name,string description,int ownerId,UserDto owner,string role,int assetCount,DateTime createdAt,DateTime updatedAt);

    record class WorkspaceMainPage(int Id, string name, string description, string role, DateTime createdAt, DateTime updatedAt);
}

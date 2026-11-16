using Invory.Models.enums;

namespace Invory.DTO
{
    public record ChangeRequestAnswerDto(
    ChangeRequestAnswer Answer,
    string Reason = ""
);
}

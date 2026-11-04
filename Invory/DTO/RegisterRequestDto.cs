using Microsoft.Extensions.Primitives;
using System.ComponentModel.DataAnnotations;

namespace Invory.DTO
{
    public record RegisterRequestDto(string Username, string Email, string Password);
}

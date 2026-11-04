using FluentValidation;
using Invory.DTO;

namespace Invory.Validators
{
    public class RequestRegisterDtoValidator : AbstractValidator<RegisterRequestDto>
    {

        //проверки преди да проверяваме в bd дали има такъв и ткн
        public RequestRegisterDtoValidator()
        {
            RuleFor(x => x.Username)
                .NotEmpty().WithMessage("Username is required.")
                .Length(6, 16).WithMessage("Username must be between 6 and 16 characters");

            RuleFor(x => x.Email)
                .NotEmpty().WithMessage("Email is required")
                .EmailAddress().WithMessage("Not a valid email format");

            RuleFor(x => x.Password)
                .NotEmpty().WithMessage("Password is required.")
                .MaximumLength(20).WithMessage("Password is way too long must be less than 20 characters");
        }
    }
}

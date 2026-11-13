using FluentValidation;
using Invory.DTO;

namespace Invory.Validators
{
    public class UpdateRegisterDtoValidator : AbstractValidator<UpdateRegisterDto>
    {
        public UpdateRegisterDtoValidator()
        {
            RuleFor(x => x.WorkspaceName)
                .NotEmpty().WithMessage("Workspace name cannot be empty.")
                .MaximumLength(100).WithMessage("Workspace name must not exceed 100 characters.")
                .When(x => x.WorkspaceName != null); 

            RuleFor(x => x.Description)
                .MaximumLength(300).WithMessage("Description must not exceed 300 characters.")
                .When(x => x.Description != null);
        }
    }
}

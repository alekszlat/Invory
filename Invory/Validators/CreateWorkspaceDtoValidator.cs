using FluentValidation;
using Invory.DTO;

namespace Invory.Validators
{
    public class CreateWorkspaceDtoValidator : AbstractValidator<CreateWorkspaceDto>
    {
        public CreateWorkspaceDtoValidator()
        {
            RuleFor(x => x.name)
                .NotEmpty().WithMessage("Workspace name is required.")
                .MaximumLength(100).WithMessage("Workspace name must not exceed 100 characters.");

            RuleFor(x => x.description)
                .MaximumLength(300).WithMessage("Description must not exceed 300 characters.")
                .When(x => !string.IsNullOrEmpty(x.description));
        }
    }
}

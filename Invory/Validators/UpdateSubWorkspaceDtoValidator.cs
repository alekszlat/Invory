using FluentValidation;
using Invory.DTO;

namespace Invory.Validators
{
    public class UpdateSubWorkspaceDtoValidator : AbstractValidator<UpdateSubWorkspaceDto>
    {
        public UpdateSubWorkspaceDtoValidator()
        {
            RuleFor(x => x.Name)
                .NotEmpty().WithMessage("Sub-workspace name cannot be empty.")
                .MaximumLength(100).WithMessage("Sub-workspace name must not exceed 100 characters.")
                .When(x => x.Name != null);

            RuleFor(x => x.AssetIds)
                .Must(ids => ids == null || ids.All(id => id > 0))
                .WithMessage("All asset IDs must be valid positive numbers.")
                .When(x => x.AssetIds != null);
        }
    }
}

namespace Invory.Validators
{
    using FluentValidation;
    using Invory.DTO;

    public class UpdateWorkspaceDtoValidator : AbstractValidator<UpdateRegisterDto>
    {
        public UpdateWorkspaceDtoValidator()
        {
            RuleFor(x => x.WorkspaceName)
                .NotEmpty().WithMessage("Workspace name cannot be empty if provided.")
                .MaximumLength(100).WithMessage("Workspace name must not exceed 100 characters.")
                .When(x => x.WorkspaceName != null);

            RuleFor(x => x.Description)
                .MaximumLength(300).WithMessage("Description must not exceed 300 characters.")
                .When(x => x.Description != null); 
        }
    }
}

using FluentValidation;
using Invory.DTO;

namespace Invory.Validators
{
    public class UpdateAssetDtoValidator : AbstractValidator<UpdateAssetDto>
    {
        public UpdateAssetDtoValidator()
        {
            RuleFor(x => x.Name)
                .NotEmpty().WithMessage("Asset name cannot be empty.")
                .MaximumLength(100).WithMessage("Asset name must not exceed 100 characters.")
                .When(x => x.Name != null);

            RuleFor(x => x.InventoryNumber)
                .NotEmpty().WithMessage("Inventory number cannot be empty.")
                .MaximumLength(50).WithMessage("Inventory number must not exceed 50 characters.")
                .When(x => x.InventoryNumber != null);

            RuleFor(x => x.Location)
                .MaximumLength(100).WithMessage("Location must not exceed 100 characters.")
                .When(x => x.Location != null);

            RuleFor(x => x.Quantity)
                .GreaterThanOrEqualTo(0).WithMessage("Quantity must be greater than or equal to 0.")
                .When(x => x.Quantity.HasValue);

            RuleFor(x => x.Custodian)
                .MaximumLength(100).WithMessage("Custodian must not exceed 100 characters.")
                .When(x => x.Custodian != null);

            RuleFor(x => x.Unit)
                .MaximumLength(20).WithMessage("Unit must not exceed 20 characters.")
                .When(x => x.Unit != null);

            RuleFor(x => x.Status)
                .IsInEnum().WithMessage("Invalid asset status value.")
                .When(x => x.Status.HasValue);

            RuleFor(x => x.SourceDocument)
                .MaximumLength(200).WithMessage("Source document must not exceed 200 characters.")
                .When(x => x.SourceDocument != null);

            RuleFor(x => x.ExpectedVersion)
                .GreaterThanOrEqualTo(0).WithMessage("Expected version must be a valid number.")
                .When(x => x.ExpectedVersion.HasValue);
        }
    }
}

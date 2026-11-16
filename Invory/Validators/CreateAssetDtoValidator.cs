using FluentValidation;
using Invory.Db;
using Invory.DTO;
using Microsoft.EntityFrameworkCore;

namespace Invory.Validators
{
    public class CreateAssetDtoValidator : AbstractValidator<CreateAssetDto>
    {
        private readonly AppDbContext dbContext;
        public CreateAssetDtoValidator(AppDbContext dbCont)
        {
            dbContext = dbCont;
            RuleFor(x => x.Name)
                .NotEmpty().WithMessage("Asset name is required.")
                .MaximumLength(100).WithMessage("Asset name cannot exceed 100 characters.");

            RuleFor(x => x.InventoryNumber)
                .NotEmpty().WithMessage("Inventory number is required.")
                .MaximumLength(50).WithMessage("Inventory number cannot exceed 50 characters.");

            RuleFor(x => x.Location)
                .NotEmpty().WithMessage("Location is required.")
                .MaximumLength(100).WithMessage("Location cannot exceed 100 characters.");

            RuleFor(x => x.Quantity)
                .GreaterThanOrEqualTo(0).WithMessage("Quantity cannot be negative.");

            RuleFor(x => x.Unit)
                .NotEmpty().WithMessage("Unit is required.")
                .MaximumLength(50).WithMessage("Unit cannot exceed 50 characters.");

            RuleFor(x => x.Status)
                .IsInEnum().WithMessage("Invalid asset status.");

            RuleFor(x => x.AcquiredOn)
                .LessThanOrEqualTo(DateTime.UtcNow).WithMessage("Acquisition date cannot be in the future.")
                .When(x => x.AcquiredOn.HasValue);

            RuleFor(x => x.InventoryNumber)
            .NotEmpty().WithMessage("Inventory number is required.")
            .MustAsync(BeUniqueInventoryNumber)
            .WithMessage("An asset with this inventory number already exists in this workspace.");

        }
        private async Task<bool> BeUniqueInventoryNumber(CreateAssetDto dto, string inventoryNumber, CancellationToken cancellationToken)
        {
            bool exists = await dbContext.Assets.AnyAsync(
                a => a.WorkspaceId == dto.WorkspaceId && a.InventoryNumber == inventoryNumber,cancellationToken);

            return !exists;
        }

    }
}

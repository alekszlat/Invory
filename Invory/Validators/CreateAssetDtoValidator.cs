using FluentValidation;
using Invory.DTO;

namespace Invory.Validators
{
    public class CreateAssetDtoValidator : AbstractValidator<CreateAssetDto>
    {
        public CreateAssetDtoValidator()
        {
            // Име на актива (задължително и с разумна дължина)
            RuleFor(x => x.Name)
                .NotEmpty().WithMessage("Asset name is required.")
                .MaximumLength(100).WithMessage("Asset name cannot exceed 100 characters.");

            // Инвентарен номер (задължителен)
            RuleFor(x => x.InventoryNumber)
                .NotEmpty().WithMessage("Inventory number is required.")
                .MaximumLength(50).WithMessage("Inventory number cannot exceed 50 characters.");

            // Локация (задължителна)
            RuleFor(x => x.Location)
                .NotEmpty().WithMessage("Location is required.")
                .MaximumLength(100).WithMessage("Location cannot exceed 100 characters.");

            // Количество (не може да е отрицателно)
            RuleFor(x => x.Quantity)
                .GreaterThanOrEqualTo(0).WithMessage("Quantity cannot be negative.");

            // Мерна единица (задължителна)
            RuleFor(x => x.Unit)
                .NotEmpty().WithMessage("Unit is required.")
                .MaximumLength(50).WithMessage("Unit cannot exceed 50 characters.");

            // Статус (трябва да е валидна стойност от енъма)
            RuleFor(x => x.Status)
                .IsInEnum().WithMessage("Invalid asset status.");

            // Дата на придобиване (само ако е подадена, не трябва да е в бъдещето)
            RuleFor(x => x.AcquiredOn)
                .LessThanOrEqualTo(DateTime.UtcNow).WithMessage("Acquisition date cannot be in the future.")
                .When(x => x.AcquiredOn.HasValue);
        }
    }
}

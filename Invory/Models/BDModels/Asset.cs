using Invory.Models.enums;
using System.ComponentModel.DataAnnotations;

namespace Invory.Models.BDModels
{
    public class Asset
    {
        public int Id { get; set; }

        [Required(ErrorMessage = "Asset name is required.")]
        [StringLength(150, MinimumLength = 1, ErrorMessage = "Name must be between 1 and 150 characters.")]
        public string Name { get; set; } = string.Empty;                  // Име на актива (1–150 знака)

        [Required(ErrorMessage = "Inventory number is required.")]
        [StringLength(60, MinimumLength = 1, ErrorMessage = "Inventory number must be between 1 and 60 characters.")]
        public string InventoryNumber { get; set; } = string.Empty;       // Уникален инвентарен номер (1–60 знака)

        [Required(ErrorMessage = "Location is required.")]
        [StringLength(120, MinimumLength = 1, ErrorMessage = "Location must be between 1 and 120 characters.")]
        public string Location { get; set; } = string.Empty;              // Местоположение (1–120 знака)

        [StringLength(120, ErrorMessage = "Custodian can be up to 120 characters.")]
        public string? Custodian { get; set; }            // МОЛ / Отговорно лице (0–120 знака)

        public DateTime? AcquiredOn { get; set; }           // Дата на придобиване "YYYY-MM-DD"

        [StringLength(12, ErrorMessage = "Unit can be up to 12 characters.")]
        public string Unit { get; set; } = "Count";         // Мерна единица (дефолт "бр.")

        [Range(0.000001, double.MaxValue, ErrorMessage = "Quantity must be a positive finite number.")]
        public decimal Quantity { get; set; }             // Положително число

        [Required]
        public AssetStatus Status { get; set; } = AssetStatus.Active; // Дефолт "Активен"

        [StringLength(200, ErrorMessage = "Source document can be up to 200 characters.")]
        public string? SourceDocument { get; set; }       // Основание/Документ (0–200 знака)

        // Служебни полета за контрол и история
        public DateTime? ArchivedAt { get; set; }         // Дата на архивиране

        [ConcurrencyCheck]
        public int Version { get; set; } = 1;             // Версия за защита срещу конфликтни редакции (409)

        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
        public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;

        // Връзки с йерархията
        public int WorkspaceId { get; set; }
        public WorkSpace Workspace { get; set; } = null!;

        public int? SubWorkspaceId { get; set; }
        public SubWorkSpace? SubWorkspace { get; set; }
    }
}   
namespace Invory.DTO
{
    public class PaginationCalculator
    {
        public int Page { get; }
        public int PageSize { get; }
        public int Skip { get; }

        public PaginationCalculator(int? page, int? pageSize)
        {
            // 1. Страница по подразбиране: 1
            Page = page.HasValue && page.Value > 0 ? page.Value : 1;

            // 2. Размер на страницата: дефолт 20, максимум 100
            if (!pageSize.HasValue || pageSize.Value <= 0)
            {
                PageSize = 20;
            }
            else
            {
                PageSize = pageSize.Value > 100 ? 100 : pageSize.Value;
            }

            // 3. Изчисление на Skip за базата данни
            Skip = (Page - 1) * PageSize;
        }

        public PaginationMetaDto CalculateMeta(int totalItems)
        {
            // Според изискванията: Ако списъкът е празен, totalPages е 0
            int totalPages = totalItems > 0 ? (int)Math.Ceiling(totalItems / (double)PageSize) : 0;

            return new PaginationMetaDto(
                Page: Page,
                PageSize: PageSize,
                TotalItems: totalItems,
                TotalPages: totalPages
            );
        }
    }

    // Помощни DTO структури за отговора
    public record PaginationMetaDto(
        int Page,
        int PageSize,
        int TotalItems,
        int TotalPages
    );

    public record PagedResultDto<T>(
        List<T> Items,
        PaginationMetaDto Pagination
    );
}

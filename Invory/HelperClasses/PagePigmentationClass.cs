namespace Invory.HelperClasses
{

    public static class PaginationCalculator
    {
       
 

        public static PaginationMetaDto CalculateMeta( int totalItems,out int totalPages, out int skip, int page = 1, int pageSize = 20)
        {
            if (totalItems <= 0)
            {
                totalPages = 0;
                skip = 0;
                return new PaginationMetaDto(
                    Page: 1,
                    PageSize: pageSize,
                    TotalItems: 0,
                    TotalPages: 0
                );
            }


            pageSize = Math.Clamp(pageSize, 5, 100);
            totalPages = (int)Math.Ceiling(totalItems / (double)pageSize);

            page = Math.Clamp(page, 1, totalPages);

            skip = (page - 1) * pageSize;

            return new PaginationMetaDto(
                Page: page,
                PageSize: pageSize,
                TotalItems: totalItems,
                TotalPages: totalPages
            );
        }
   

        
      
    }
       

    public record PaginationMetaDto(
        int Page,
        int PageSize,
        int TotalItems,
        int TotalPages
    );

    public record PagedResultDto<T>(List<T> Items,PaginationMetaDto Pagination);
}

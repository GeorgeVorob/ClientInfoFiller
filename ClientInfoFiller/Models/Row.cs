using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace ClientInfoFiller.Models
{
    public class Row
    {
        public int Id { get; set; } = -1;
        public string CustomerName { get; set; } = "";
        public string CostumeName { get; set; } = "";

        public string Phone { get; set; } = "";

        public DateTimeOffset CreationDate { get; set; } = DateTimeOffset.Now;
        public string CreationDateString => this.CreationDate.ToString("yyyy-MM-dd");
        public DateTimeOffset ActualOrderDate { get; set;} = DateTimeOffset.Now;
        public string ActualOrderDateString => this.ActualOrderDate.ToString("yyyy-MM-dd");
        public DateTimeOffset ReturnDate { get; set; } = DateTimeOffset.Now;
        public string ReturnDateString => this.ReturnDate.ToString("yyyy-MM-dd");
        public int Price { get; set; } = 0;

        // Предоплата и долг?

        public string Comment { get; set; } = "";
    }
}

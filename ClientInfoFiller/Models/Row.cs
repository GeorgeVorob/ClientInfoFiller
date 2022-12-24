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
        public string CreationDateString => this.CreationDate.ToString("dd.MM.yyyy");
        public DateTimeOffset ActualOrderDate { get; set;} = DateTimeOffset.Now;
        public string ActualOrderDateString => this.ActualOrderDate.ToString("dd.MM.yyyy");
        public DateTimeOffset ReturnDate { get; set; } = DateTimeOffset.Now;
        public string ReturnDateString => this.ReturnDate.ToString("dd.MM.yyyy");
        public int Price { get; set; } = 0;
        public int Prepayment { get; set; } = 0;
        public int Owe => Price - Prepayment;



        public string Comment { get; set; } = "";
    }
}

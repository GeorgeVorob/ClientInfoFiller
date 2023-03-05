using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace ClientInfoFiller.Models
{
    public class Row
    {
        public int RowPos { get; set; } = -1;
        public int Id { get; set; } = -1;
        public string CustomerName { get; set; } = "";
        public string CostumeName { get; set; } = "";

        public string Phone { get; set; } = "";

        //TODO: мб переименовать во что-то другое. Это дата заявки из UI, а есть ещё дата печати.
        public DateTimeOffset CreationDate { get; set; } = DateTimeOffset.Now;
        public string CreationDateString => this.CreationDate.ToString(DateFormatString);
        public DateTimeOffset ActualOrderDate { get; set; } = DateTimeOffset.Now;
        public string ActualOrderDateString => this.ActualOrderDate.ToString(DateFormatString);
        public DateTimeOffset ReturnDate { get; set; } = DateTimeOffset.Now;
        public string ReturnDateString => this.ReturnDate.ToString(DateFormatString);
        public int Price { get; set; } = 0;
        public int Prepayment { get; set; } = 0;
        public int Owe => Price - Prepayment;

        /// <summary>
        /// Залог, не имеет связи с долгом или предоплатой.
        /// </summary>
        public int PledgeCash { get; set; } = 0;
        public int PledgeDigital { get; set; } = 0;

        public string Comment { get; set; } = "";

        public static readonly string DateFormatString = "dd.MM.yyyy";
    }
}

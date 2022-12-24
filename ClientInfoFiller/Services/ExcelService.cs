using ClientInfoFiller.Models;
using Syncfusion.XlsIO;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;
using Windows.Storage;
using Windows.UI.Xaml.Controls;

namespace ClientInfoFiller.Services
{
    public class ExcelService
    {
        private StorageFile _file;
        public ExcelService(StorageFile file) 
        {
            _file = file;
        }
        public async Task SaveRow(Row data)
        {
            ExcelEngine excelEngine = new ExcelEngine();
            IApplication application = excelEngine.Excel;
            IWorkbook workbook = await application.Workbooks.OpenAsync(_file);
            IWorksheet worksheet = workbook.Worksheets[0];

            int rowID = 2;
            int lastIdInRow = 1;
            while(true)
            {
                if (worksheet.Range[$"A{rowID}"].Value != String.Empty &&
                    worksheet.Range[$"A{rowID}"].Value != null)
                {
                    lastIdInRow = Int32.Parse(worksheet.Range[$"A{rowID}"].Value);
                    rowID++;
                }
                else break;
            }
            lastIdInRow++;

            worksheet.Range[$"A{rowID}"].Number = lastIdInRow;
            worksheet.Range[$"B{rowID}"].Text = data.CustomerName;
            worksheet.Range[$"C{rowID}"].Text = data.CostumeName;
            worksheet.Range[$"D{rowID}"].Text = data.Phone;
            worksheet.Range[$"E{rowID}"].Text = data.CreationDateString;
            worksheet.Range[$"F{rowID}"].Text = data.ActualOrderDateString;
            worksheet.Range[$"G{rowID}"].Text = data.ReturnDateString;
            worksheet.Range[$"H{rowID}"].Number = data.Price;
            worksheet.Range[$"I{rowID}"].Number = data.Prepayment;
            worksheet.Range[$"J{rowID}"].Number = data.Owe;
            worksheet.Range[$"M{rowID}"].Text = data.Comment;

            workbook.Version = ExcelVersion.Xlsx;

            bool result = await workbook.SaveAsAsync(_file);
            workbook.Close();
            excelEngine.Dispose();
        }
    }
}

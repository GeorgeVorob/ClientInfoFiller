using ClientInfoFiller.Models;
using Syncfusion.XlsIO;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;
using Windows.Storage;

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
            // worksheet.Range["A3"].Text = data;

            int rowID = 2;
            int lastIdInRow = 0;
            while(true)
            {
                if (worksheet.Range[$"A{rowID}"].Text != String.Empty &&
                    worksheet.Range[$"A{rowID}"].Text != null)
                {
                    lastIdInRow = Int32.Parse(worksheet.Range[$"A{rowID}"].Text);
                }
                else break;

                rowID++;
            }
            lastIdInRow++;

            worksheet.Range[$"A{rowID}"].Text = lastIdInRow.ToString();
            worksheet.Range[$"B{rowID}"].Text = data.CustomerName;
            worksheet.Range[$"C{rowID}"].Text = data.CostumeName;
            worksheet.Range[$"D{rowID}"].Text = data.Phone;
            worksheet.Range[$"E{rowID}"].Text = data.CreationDateString;
            worksheet.Range[$"F{rowID}"].Text = data.ActualOrderDateString;
            worksheet.Range[$"G{rowID}"].Text = data.ReturnDateString;
            worksheet.Range[$"H{rowID}"].Text = data.Price.ToString();
            worksheet.Range[$"I{rowID}"].Text = data.Comment;


            workbook.Version = ExcelVersion.Xlsx;

            await workbook.SaveAsAsync(_file);
            workbook.Close();
            excelEngine.Dispose();
        }
    }
}

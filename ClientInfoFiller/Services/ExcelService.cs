using ClientInfoFiller.Models;
using Syncfusion.XlsIO;
using System;
using System.Collections.Generic;
using System.Globalization;
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

            if (data.RowPos == -1)
            {
                int lastRowID = -1;
                data.RowPos = FindLastEmptyRow(worksheet, out lastRowID);
                data.Id = lastRowID + 1;
            }
            WriteRow(worksheet, data);

            workbook.Version = ExcelVersion.Xlsx;

            bool result = await workbook.SaveAsAsync(_file);
            workbook.Close();
            excelEngine.Dispose();
        }

        public async Task<List<Row>> SearchRow(SearchModes searchMode, string searchValue, int amount = 1)
        {
            if (searchValue == null) searchValue = "";

            ExcelEngine excelEngine = new ExcelEngine();
            IApplication application = excelEngine.Excel;
            IWorkbook workbook = await application.Workbooks.OpenAsync(_file);
            IWorksheet worksheet = workbook.Worksheets[0];

            List<Row> result = new List<Row>();
            int lastRowID = -1;
            int rowPos = FindLastEmptyRow(worksheet, out lastRowID);
            rowPos--;

            while (amount - result.Count > 0 && rowPos >= 2)
            {
                bool flag = false;

                switch (searchMode)
                {
                    case SearchModes.ByID:
                        if (worksheet.Range[$"A{rowPos}"].Value == searchValue) flag = true;
                        break;
                    case SearchModes.ByCustomerName:
                        if (worksheet.Range[$"B{rowPos}"].Value.Contains(searchValue)) flag = true;
                        break;
                    case SearchModes.ByCostumeName:
                        if (worksheet.Range[$"C{rowPos}"].Value.Contains(searchValue)) flag = true;
                        break;
                    case SearchModes.ByProhe:
                        if (worksheet.Range[$"D{rowPos}"].Value.Contains(searchValue)) flag = true;
                        break;

                }

                if (flag)
                    result.Add(ReadRow(worksheet, rowPos));


                rowPos--;
            }

            workbook.Close();
            excelEngine.Dispose();

            return result;
        }

        /// <summary>
        /// Возвращает данные о последней пустой строке в таблице.
        /// </summary>
        /// <param name="worksheet"></param>
        /// <param name="lastRowID">Возвращает последний занятый ID на строке выше</param>
        /// <returns>Позиция последней свободной строки в таблице</returns>
        private static int FindLastEmptyRow(IWorksheet worksheet, out int lastRowID)
        {
            int rowPos = 2;
            lastRowID = 1;
            while (true)
            {
                if (worksheet.Range[$"A{rowPos}"].Value != String.Empty &&
                    worksheet.Range[$"A{rowPos}"].Value != null)
                {
                    lastRowID = Int32.Parse(worksheet.Range[$"A{rowPos}"].Value);
                    rowPos++;
                }
                else break;
            }
            lastRowID++;
            return rowPos;
        }

        private Row ReadRow(IWorksheet worksheet, int rowPos)
        {
            DateTimeOffset tmpDate = DateTimeOffset.Now;
            int tmpInt = 0;
            bool tmpFlag;

            Row retval = new Row();
            retval.RowPos = rowPos;

            tmpFlag = int.TryParse(worksheet.Range[$"A{rowPos}"].Value, out tmpInt);
            retval.Id = tmpFlag ? tmpInt : -1;


            retval.CustomerName = worksheet.Range[$"B{rowPos}"].Value;
            retval.CostumeName = worksheet.Range[$"C{rowPos}"].Value;
            retval.Phone = worksheet.Range[$"D{rowPos}"].Value;

            tmpFlag = DateTimeOffset.TryParseExact(worksheet.Range[$"E{rowPos}"].Value,
                Row.DateFormatString,
                CultureInfo.InvariantCulture,
                DateTimeStyles.None, out tmpDate);
            retval.CreationDate = tmpFlag ? tmpDate : DateTimeOffset.Now;

            tmpFlag = DateTimeOffset.TryParseExact(worksheet.Range[$"F{rowPos}"].Value,
                Row.DateFormatString,
                CultureInfo.InvariantCulture,
                DateTimeStyles.None, out tmpDate);
            retval.ActualOrderDate = tmpFlag ? tmpDate : DateTimeOffset.Now;

            tmpFlag = DateTimeOffset.TryParseExact(worksheet.Range[$"G{rowPos}"].Value,
                Row.DateFormatString,
                CultureInfo.InvariantCulture,
                DateTimeStyles.None, out tmpDate);
            retval.ReturnDate = tmpFlag ? tmpDate : DateTimeOffset.Now;


            tmpFlag = int.TryParse(worksheet.Range[$"H{rowPos}"].Value, out tmpInt);
            retval.Price = tmpFlag ? tmpInt : 0;

            tmpFlag = int.TryParse(worksheet.Range[$"I{rowPos}"].Value, out tmpInt);
            retval.Prepayment = tmpFlag ? tmpInt : 0;

            tmpFlag = int.TryParse(worksheet.Range[$"K{rowPos}"].Value, out tmpInt);
            retval.Pledge = tmpFlag ? tmpInt : 0;


            retval.Comment = worksheet.Range[$"M{rowPos}"].Value;

            return retval;
        }

        private void WriteRow(IWorksheet worksheet, Row data)
        {
            if (data.RowPos == null || data.RowPos < 2) throw new ArgumentException("Некорректная позиция строки при сохранении.");

            int rowPos = data.RowPos;

            worksheet.Range[$"A{rowPos}"].Number = data.Id;
            worksheet.Range[$"B{rowPos}"].Text = data.CustomerName;
            worksheet.Range[$"C{rowPos}"].Text = data.CostumeName;
            worksheet.Range[$"D{rowPos}"].Text = data.Phone;
            worksheet.Range[$"E{rowPos}"].Text = data.CreationDateString;
            worksheet.Range[$"F{rowPos}"].Text = data.ActualOrderDateString;
            worksheet.Range[$"G{rowPos}"].Text = data.ReturnDateString;
            worksheet.Range[$"H{rowPos}"].Number = data.Price;
            worksheet.Range[$"I{rowPos}"].Number = data.Prepayment;
            worksheet.Range[$"J{rowPos}"].Number = data.Owe;
            worksheet.Range[$"K{rowPos}"].Number = data.Pledge;
            worksheet.Range[$"M{rowPos}"].Text = data.Comment;
        }
    }
}

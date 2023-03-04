using ClientInfoFiller.Models;
using OfficeOpenXml;
using System;
using System.Collections.Generic;
using System.Globalization;
using System.IO;

namespace ClientInfoFiller.Services
{
    public class ExcelService
    {
        private FileInfo _file;
        public ExcelService(FileInfo file)
        {
            _file = file;
        }
        public void SaveRow(Row data)
        {
            ExcelPackage excelPackage = new ExcelPackage(_file);
            ExcelWorksheet worksheet = excelPackage.Workbook.Worksheets[0];

            if (data.RowPos == -1)
            {
                int lastRowID = -1;
                data.RowPos = FindLastEmptyRow(worksheet, out lastRowID);
                data.Id = lastRowID;
            }
            WriteRow(worksheet, data);

            excelPackage.Save();
        }

        public List<Row> SearchRow(SearchModes searchMode, string searchValue, int amount = 1)
        {
            if (searchValue == null) searchValue = "";

            ExcelPackage excelPackage = new ExcelPackage(_file);
            ExcelWorksheet worksheet = excelPackage.Workbook.Worksheets[0];
            ExcelRange cells = worksheet.Cells;

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
                        if (cells[rowPos, 1].Text == searchValue) flag = true;
                        break;
                    case SearchModes.ByCustomerName:
                        if (cells[rowPos, 2].Text.Contains(searchValue)) flag = true;
                        break;
                    case SearchModes.ByCostumeName:
                        if (cells[rowPos, 3].Text.Contains(searchValue)) flag = true;
                        break;
                    case SearchModes.ByProhe:
                        if (cells[rowPos, 4].Text.Contains(searchValue)) flag = true;
                        break;

                }

                if (flag)
                    result.Add(ReadRow(worksheet, rowPos));

                rowPos--;
            }

            excelPackage.Dispose();

            return result;
        }

        /// <summary>
        /// Возвращает данные о последней пустой строке в таблице.
        /// </summary>
        /// <param name="worksheet"></param>
        /// <param name="lastRowID">Возвращает последний занятый ID на строке выше</param>
        /// <returns>Позиция последней свободной строки в таблице</returns>
        private static int FindLastEmptyRow(ExcelWorksheet worksheet, out int lastRowID)
        {
            int rowPos = 2;
            lastRowID = 1;
            while (true)
            {
                if (worksheet.Cells[rowPos, 1].Text != String.Empty &&
                    worksheet.Cells[rowPos, 1].Text != null)
                {
                    lastRowID = Int32.Parse(worksheet.Cells[rowPos, 1].Text);
                    rowPos++;
                }
                else break;
            }
            lastRowID++;
            return rowPos;
        }

        private Row ReadRow(ExcelWorksheet worksheet, int rowPos)
        {
            DateTimeOffset tmpDate = DateTimeOffset.Now;
            int tmpInt = 0;
            bool tmpFlag;

            Row retval = new Row();
            retval.RowPos = rowPos;

            tmpFlag = int.TryParse(worksheet.Cells[rowPos, 1].Text, out tmpInt);
            retval.Id = tmpFlag ? tmpInt : -1;


            retval.CustomerName = worksheet.Cells[rowPos, 2].Text;
            retval.CostumeName = worksheet.Cells[rowPos, 3].Text;
            retval.Phone = worksheet.Cells[rowPos, 4].Text;

            tmpFlag = DateTimeOffset.TryParseExact(worksheet.Cells[rowPos, 5].Text,
                Row.DateFormatString,
                CultureInfo.InvariantCulture,
                DateTimeStyles.None, out tmpDate);
            retval.CreationDate = tmpFlag ? tmpDate : DateTimeOffset.Now;

            tmpFlag = DateTimeOffset.TryParseExact(worksheet.Cells[rowPos, 6].Text,
                Row.DateFormatString,
                CultureInfo.InvariantCulture,
                DateTimeStyles.None, out tmpDate);
            retval.ActualOrderDate = tmpFlag ? tmpDate : DateTimeOffset.Now;

            tmpFlag = DateTimeOffset.TryParseExact(worksheet.Cells[rowPos, 7].Text,
                Row.DateFormatString,
                CultureInfo.InvariantCulture,
                DateTimeStyles.None, out tmpDate);
            retval.ReturnDate = tmpFlag ? tmpDate : DateTimeOffset.Now;

            tmpFlag = int.TryParse(worksheet.Cells[rowPos, 8].Text, out tmpInt);
            retval.Price = tmpFlag ? tmpInt : 0;

            tmpFlag = int.TryParse(worksheet.Cells[rowPos, 9].Text, out tmpInt);
            retval.Prepayment = tmpFlag ? tmpInt : 0;

            tmpFlag = int.TryParse(worksheet.Cells[rowPos, 10].Text, out tmpInt);
            retval.Pledge = tmpFlag ? tmpInt : 0;


            retval.Comment = worksheet.Cells[rowPos, 11].Text;

            return retval;
        }

        private void WriteRow(ExcelWorksheet worksheet, Row data)
        {
            if (data.RowPos == null || data.RowPos < 2) throw new ArgumentException("Некорректная позиция строки при сохранении.");

            int rowPos = data.RowPos;

            worksheet.Cells[rowPos, 1].Value = data.Id;
            worksheet.Cells[rowPos, 2].Value = data.CustomerName;
            worksheet.Cells[rowPos, 3].Value = data.CostumeName;
            worksheet.Cells[rowPos, 4].Value = data.Phone;
            worksheet.Cells[rowPos, 5].Value = data.CreationDateString;
            worksheet.Cells[rowPos, 6].Value = data.ActualOrderDateString;
            worksheet.Cells[rowPos, 7].Value = data.ReturnDateString;
            worksheet.Cells[rowPos, 8].Value = data.Price;
            worksheet.Cells[rowPos, 9].Value = data.Prepayment;
            worksheet.Cells[rowPos, 10].Value = data.Owe;
            worksheet.Cells[rowPos, 11].Value = data.Pledge;
            worksheet.Cells[rowPos, 12].Value = data.Comment;
        }
    }
}

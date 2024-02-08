using Avalonia;
using Avalonia.Platform;
using ClientInfoFiller.Models;
using System;
using System.Diagnostics;
using System.IO;
using System.Linq;
using Xceed.Words.NET;

namespace ClientInfoFiller.Services
{
    public class WordService
    {
        /// <summary>
        /// Ключи для закладок:
        /// 
        /// ID
        /// CustomerName
        /// CostumeName
        /// Phone
        /// CreationDate
        /// ActualOrderDate
        /// ReturnDate
        /// Price
        /// Prepayment
        /// Owe
        /// Pledge
        /// PrintDateTime
        /// 
        /// </summary>
        /// <param name="data"></param>
        /// <returns></returns>
        public void FillAndPrint(Row data)
        {
            string systemPath = Environment.GetFolderPath(Environment.SpecialFolder.ApplicationData);
            string folderToSavePath = Path.Combine(systemPath, "ClientFillerFiles");
            Directory.CreateDirectory(folderToSavePath);

            IAssetLoader? assets = AvaloniaLocator.Current.GetService<IAssetLoader>();
            if (assets == null)
                throw new Exception("Assets broken");

            // var uri = new Uri($"avares://{Assembly.GetExecutingAssembly().GetName().Name}/Assets/wordTemplate.docx");

            Stream assetWordFile;
            try
            {
                assetWordFile = File.Open(@"Assets/wordTemplate.docx", FileMode.Open);
                if (assetWordFile == null)
                    throw new Exception("FileStream broken");
            }
            catch (Exception ex)
            {
                throw new Exception("FileStream broken");
            }

            int tempFileNumber = 0;
            FileStream? tempFile = null;

            if (!Directory.Exists(@"Tempfiles/")) Directory.CreateDirectory(@"Tempfiles/");
            DirectoryInfo dirWithTemps = new DirectoryInfo(@"Tempfiles/");

            // Удаляем все не занятые файлы
            foreach (FileInfo file in dirWithTemps.GetFiles())
            {
                try
                {
                    file.Delete();
                }
                catch (IOException){}
            }

            while (tempFileNumber < int.MaxValue)
            {
                if(!File.Exists($@"Tempfiles/temp-{tempFileNumber}.docx"))
                {
                    tempFile = File.Create($@"Tempfiles/temp-{tempFileNumber}.docx");
                    break;
                }
                tempFileNumber++;
            }
            if (tempFile == null) throw new Exception("Не удалось создать временный файл для печати");

            assetWordFile.CopyTo(tempFile);
            tempFile.Close();


            using (var doc = DocX.Load(tempFile.Name))
            {
                var bookmarks = doc.GetBookmarks();

                Xceed.Document.NET.Formatting bookmarkTextFormat = new ();
                bookmarkTextFormat.Bold= true;
                bookmarkTextFormat.FontFamily = new Xceed.Document.NET.Font("Times New Roman");

                foreach (var bookMark in bookmarks)
                {
                    string BookmarkTemplateName =
                        string.Concat(bookMark.Name.TakeWhile(c => c < '0' || c > '9'));

                    switch (BookmarkTemplateName)
                    {
                        case "ID":
                            bookMark.SetText(data.Id.ToString(), bookmarkTextFormat);
                            break;

                        case "CustomerName":
                            bookMark.SetText(data.CustomerName, bookmarkTextFormat);
                            break;

                        case "CostumeName":
                            bookMark.SetText(data.CostumeName, bookmarkTextFormat);
                            break;

                        case "Phone":
                            bookMark.SetText(data.Phone, bookmarkTextFormat);
                            break;

                        case "CreationDate":
                            bookMark.SetText(data.CreationDateString, bookmarkTextFormat);
                            break;

                        case "ActualOrderDate":
                            bookMark.SetText(data.ActualOrderDateString, bookmarkTextFormat);
                            break;

                        case "ReturnDate":
                            bookMark.SetText(data.ReturnDateString, bookmarkTextFormat);
                            break;

                        case "Price":
                            bookMark.SetText(data.Price.ToString(), bookmarkTextFormat);
                            break;

                        case "Prepayment":
                            string cashText = data.PrepaymentCash != 0 ? $"{data.PrepaymentCash}(н)" : "";
                            string digitalText = data.PrepaymentDigital != 0 ? $"{data.PrepaymentDigital}(бн)" : "";
                            string resultText = $"{cashText} {digitalText}".Trim();

                            bookMark.SetText(resultText, bookmarkTextFormat);
                            break;

                        case "Owe":
                            bookMark.SetText(data.Owe.ToString(), bookmarkTextFormat);
                            break;

                        case "Pledge":
                            string cashPledgeText = data.PledgeCash != 0 ? $"{data.PledgeCash}(н)" : "";
                            string digitalPledgeText = data.PledgeDigital != 0 ? $"{data.PledgeDigital}(бн)" : "";
                            string pledgeResultText = $"{cashPledgeText} {digitalPledgeText}".Trim();

                            bookMark.SetText(pledgeResultText, bookmarkTextFormat);
                            break;

                        case "Comment":
                            bookMark.SetText(data.Comment, bookmarkTextFormat);
                            break;               

                        case "PrintDateTime":
                            bookMark.SetText(DateTime.Now.ToString("dd/MM/yyyy H:mm"), bookmarkTextFormat);
                            break;
                    }
                }


                doc.Save();
                doc.Dispose();
            }
            var p = new Process();
            p.StartInfo = new ProcessStartInfo(tempFile.Name)
            {
                UseShellExecute = true
            };
            p.Start();
        }
    }
}

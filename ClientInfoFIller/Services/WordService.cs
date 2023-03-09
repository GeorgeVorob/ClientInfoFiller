using Avalonia;
using Avalonia.Platform;
using ClientInfoFiller.Models;
using System;
using System.Diagnostics;
using System.IO;
using System.Linq;
using System.Reflection;
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
            string systemPath = System.Environment.GetFolderPath(Environment.SpecialFolder.ApplicationData);
            string folderToSavePath = Path.Combine(systemPath, "ClientFillerFiles");
            Directory.CreateDirectory(folderToSavePath);

            IAssetLoader? assets = AvaloniaLocator.Current.GetService<IAssetLoader>();
            if (assets == null)
                throw new Exception("Assets broken");

            var uri = new Uri($"avares://{Assembly.GetExecutingAssembly().GetName().Name}/Assets/wordTemplate.docx");

            Stream assetWordFile = assets.Open(uri);
            if (assetWordFile == null)
                throw new Exception("FileStream broken");

            int tempFileNumber = 0;
            FileStream? tempFile = null;

            if (!Directory.Exists(@"Tempfiles/")) Directory.CreateDirectory(@"Tempfiles/");

            while (tempFileNumber < int.MaxValue)
            {
                if(!File.Exists($@"Tempfiles/temp-{tempFileNumber}.docx"))
                {
                    tempFile = File.Create($@"Tempfiles/temp-{tempFileNumber}.docx");
                    break;
                }
                else
                {
                    try
                    {
                        File.Delete($@"Tempfiles/temp-{tempFileNumber}.docx");
                        tempFile = File.Create($@"Tempfiles/temp-{tempFileNumber}.docx");
                        break;
                    }
                    catch(IOException)
                    {
                        tempFileNumber++;
                    }
                }
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
                            bookMark.SetText(data.CustomerName);
                            bookMark.SetText("2", bookmarkTextFormat);
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
                            bookMark.SetText((data.PrepaymentCash + data.PrepaymentDigital).ToString(), bookmarkTextFormat);
                            break;

                        case "Owe":
                            bookMark.SetText(data.Owe.ToString(), bookmarkTextFormat);
                            break;

                        case "Pledge":
                            bookMark.SetText((data.PledgeCash + data.PledgeDigital).ToString(), bookmarkTextFormat);
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

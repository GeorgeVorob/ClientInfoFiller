using Avalonia;
using Avalonia.Controls;
using Avalonia.Markup.Xaml.Templates;
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
        /// PledgeCash
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

            FileStream tempFile = File.Create(@"temp.docx");
            assetWordFile.CopyTo(tempFile);
            tempFile.Close();


            using (var doc = DocX.Load(tempFile.Name))
            {
                var bookmarks = doc.GetBookmarks();

                foreach (var bookMark in bookmarks)
                {
                    string BookmarkTemplateName =
                        string.Concat(bookMark.Name.TakeWhile(c => c < '0' || c > '9'));

                    switch (BookmarkTemplateName)
                    {
                        case "ID":
                            bookMark.SetText(data.Id.ToString());
                            break;

                        case "CustomerName":
                            bookMark.SetText(data.CustomerName);
                            break;

                        case "CostumeName":
                            bookMark.SetText(data.CostumeName);
                            break;

                        case "Phone":
                            bookMark.SetText(data.Phone);
                            break;

                        case "CreationDate":
                            bookMark.SetText(data.CreationDateString);
                            break;

                        case "ActualOrderDate":
                            bookMark.SetText(data.ActualOrderDateString);
                            break;

                        case "ReturnDate":
                            bookMark.SetText(data.ReturnDateString);
                            break;

                        case "Price":
                            bookMark.SetText(data.Price.ToString());
                            break;

                        case "Prepayment":
                            bookMark.SetText(data.Prepayment.ToString());
                            break;

                        case "Owe":
                            bookMark.SetText(data.Owe.ToString());
                            break;

                        case "Pledge":
                            bookMark.SetText(data.PledgeCash.ToString());
                            break;

                        case "Comment":
                            bookMark.SetText(data.Comment);
                            break;               

                        case "PrintDateTime":
                            bookMark.SetText(DateTime.Now.ToString("dd/MM/yyyy H:mm"));
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

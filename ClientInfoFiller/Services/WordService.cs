using ClientInfoFiller.Models;
using Syncfusion.DocIO;
using Syncfusion.DocIO.DLS;
using Syncfusion.XlsIO.Implementation;
using System;
using System.Collections.Generic;
using System.IO;
using System.Linq;
using System.Reflection.Metadata;
using System.Text;
using System.Threading.Tasks;
using Windows.Graphics.Printing;
using Windows.Storage;
using Windows.UI.Core;
using Windows.UI.Xaml;
using Windows.UI.Xaml.Printing;
using static System.Net.Mime.MediaTypeNames;


namespace ClientInfoFiller.Services
{
    public class WordService
    {
        public async Task FillAndPrint(Row data)
        {
            StorageFile file = await StorageFile.
                GetFileFromApplicationUriAsync(new Uri("ms-appx:///Assets/wordTemplate.docx"));

            StorageFile tempFile = await file.CopyAsync(ApplicationData.Current.LocalFolder, "temp.docx", NameCollisionOption.ReplaceExisting);

            Stream stream = await tempFile.OpenStreamForWriteAsync();
            WordDocument doc = new WordDocument(stream, FormatType.Docx);
            stream.Close();

            BookmarksNavigator bookmarkNavigator = new BookmarksNavigator(doc);

            BookmarkCollection bookmarks = doc.Bookmarks;

            foreach (Bookmark bookmark in bookmarks)
            {
                string BookmarkTemplateName =
                    string.Concat(bookmark.Name.TakeWhile(c => c < '0' || c > '9'));
                switch (BookmarkTemplateName)
                {
                    case "CustomerName":
                        bookmarkNavigator.MoveToBookmark(bookmark.Name);
                        bookmarkNavigator.InsertText(data.CustomerName);
                        break;

                    case "CostumeName":
                        bookmarkNavigator.MoveToBookmark(bookmark.Name);
                        bookmarkNavigator.InsertText(data.CostumeName);
                        break;

                    case "Phone":
                        bookmarkNavigator.MoveToBookmark(bookmark.Name);
                        bookmarkNavigator.InsertText(data.Phone);
                        break;

                    case "CreationDate":
                        bookmarkNavigator.MoveToBookmark(bookmark.Name);
                        bookmarkNavigator.InsertText(data.CreationDateString);
                        break;

                    case "ActualOrderDate":
                        bookmarkNavigator.MoveToBookmark(bookmark.Name);
                        bookmarkNavigator.InsertText(data.ActualOrderDateString);
                        break;

                    case "ReturnDate":
                        bookmarkNavigator.MoveToBookmark(bookmark.Name);
                        bookmarkNavigator.InsertText(data.ReturnDateString);
                        break;

                    case "Price":
                        bookmarkNavigator.MoveToBookmark(bookmark.Name);
                        bookmarkNavigator.InsertText(data.Price.ToString());
                        break;
                }
            }

            stream = await tempFile.OpenStreamForWriteAsync();
            doc.Save(stream, FormatType.Docx);
            doc.Close();
            stream.Close();


            await Window.Current.Dispatcher.RunAsync(CoreDispatcherPriority.High,
          async () =>
          {
              await Windows.System.Launcher.LaunchFileAsync(tempFile, new Windows.System.LauncherOptions { DisplayApplicationPicker = true });
          });
        }
    }
}

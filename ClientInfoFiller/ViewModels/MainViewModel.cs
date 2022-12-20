using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;
using ClientInfoFiller.Models;
using ClientInfoFiller.Services;
using CommunityToolkit.Mvvm;
using CommunityToolkit.Mvvm.ComponentModel;
using Windows.Storage;
using Windows.Storage.Pickers;

namespace ClientInfoFiller.ViewModels
{
    public class MainViewModel : ObservableObject
    {
        private const string fileTokenSettingsKey = "token";

        private StorageFile _openedFile;
        public StorageFile OpenedFile
        {
            get => _openedFile;
            set
            {
                SetProperty(ref _openedFile, value);
                CanAccessFile = OpenedFile != null;
            }
        }

        private bool _canAccesFile;
        public bool CanAccessFile
        {
            get => _canAccesFile;
            set => SetProperty(ref _canAccesFile, value);
        }

        public Row CurrentRow { get; set; } = new Row();
        public MainViewModel()
        {
            ApplicationDataContainer localSettings = ApplicationData.Current.LocalSettings;
            string token = (string)localSettings.Values[fileTokenSettingsKey];

            if (token != null && token != String.Empty)
            {
                FileService fs = new FileService();
                var fileTask = fs.GetFileForToken(token);
                //FIXME: bad
                OpenedFile = fileTask.Result as StorageFile;
            }
        }
        public async Task OnRowSaveClick()
        {
            if (OpenedFile == null) throw new Exception("Пожалуйста, укажите путь к файлу таблицы.");

            ExcelService excel = new ExcelService(OpenedFile);
            WordService word = new WordService();

            await excel.SaveRow(this.CurrentRow);
            await word.FillAndPrint(this.CurrentRow);
            this.CurrentRow = new Row();
            OnPropertyChanged(nameof(CurrentRow));
        }

        public async Task OnFileSelectClick()
        {
            FileOpenPicker openPicker = new FileOpenPicker();
            openPicker.SuggestedStartLocation = PickerLocationId.Desktop;
            openPicker.FileTypeFilter.Add(".xlsx");
            openPicker.FileTypeFilter.Add(".xls");
            StorageFile openFile = await openPicker.PickSingleFileAsync();

            if (openFile != null)
            {
                ApplicationDataContainer localSettings = ApplicationData.Current.LocalSettings;
                FileService fs = new FileService();

                localSettings.Values[fileTokenSettingsKey] = fs.RememberFile(openFile);
                OpenedFile = openFile;
            }
            CanAccessFile = OpenedFile != null;
        }
    }
}

using System;
using System.Collections.Generic;
using System.Collections.ObjectModel;
using System.Linq;
using System.Text;
using System.Threading.Tasks;
using ClientInfoFiller.Models;
using ClientInfoFiller.Services;
using CommunityToolkit.Mvvm;
using CommunityToolkit.Mvvm.ComponentModel;
using Windows.Storage;
using Windows.Storage.Pickers;
using Windows.UI.Xaml.Media;

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

        private Row _currentRow;
        public Row CurrentRow
        {
            get => _currentRow;
            set
            {
                SetProperty(ref _currentRow, value);
                UpdateFields();
            }
        }

        public int FormPrice
        {
            set
            {
                CurrentRow.Price = value;
                OnPropertyChanged(nameof(CurrentRow));
            }

            get => CurrentRow.Price;
        }

        public int FormPrepayment
        {
            set
            {
                CurrentRow.Prepayment = value;
                OnPropertyChanged(nameof(CurrentRow));
            }

            get => CurrentRow.Prepayment;
        }
        public ObservableCollection<string> searchModesComboBoxData = new ObservableCollection<string>();

        private string _selectedSearchMode;
        public string SelectedSearchMode
        {
            get => _selectedSearchMode;
            set => SetProperty(ref _selectedSearchMode, value);
        }

        private string _searchValue;
        public string SearchValue
        {
            get => _searchValue;
            set => SetProperty(ref _searchValue, value);
        }

        public ObservableCollection<Row> FoundRows = new ObservableCollection<Row>();

        public bool IsNewRow => CurrentRow.RowPos == -1;

        public MainViewModel()
        {
            CurrentRow = new Row();
            searchModesComboBoxData.Add("По номеру записи");
            searchModesComboBoxData.Add("По ФИО");
            searchModesComboBoxData.Add("По номеру телефона");
            searchModesComboBoxData.Add("По костюму");
            SelectedSearchMode = searchModesComboBoxData[0];

            ApplicationDataContainer localSettings = ApplicationData.Current.LocalSettings;
            string token = (string)localSettings.Values[fileTokenSettingsKey];

            if (token != null && token != String.Empty)
            {
                try
                {
                    FileService fs = new FileService();
                    var fileTask = fs.GetFileForToken(token);
                    //FIXME: bad
                    OpenedFile = fileTask.Result as StorageFile;
                }
                catch
                {
                    OpenedFile = null;
                }
            }
        }
        public async Task OnRowSaveClick()
        {
            if (OpenedFile == null) throw new Exception("Пожалуйста, укажите путь к файлу таблицы.");

            ExcelService excel = new ExcelService(OpenedFile);
            WordService word = new WordService();

            bool isNew = CurrentRow.RowPos == -1;
            await excel.SaveRow(this.CurrentRow);
            if (isNew)
            {
                await word.FillAndPrint(this.CurrentRow);
                this.CurrentRow = new Row();
            }

            UpdateFields();
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

        public async Task OnSearchClick()
        {
            ExcelService excel = new ExcelService(OpenedFile);
            FoundRows.Clear();

            SearchModes searchMode = SearchModes.ByID;

            switch(SelectedSearchMode)
            {
                case "По номеру записи": searchMode = SearchModes.ByID; break;
                case "По ФИО": searchMode = SearchModes.ByCustomerName; break;
                case "По номеру телефона": searchMode = SearchModes.ByProhe; break;
                case "По костюму": searchMode = SearchModes.ByCostumeName; break;
            }

            foreach (Row row in await excel.SearchRow(searchMode, SearchValue, 10))
            {
                FoundRows.Add(row);
            }
        }

        public void ResetCurrentRow() => CurrentRow = new Row();

        public void OnFoundCustomerClick(Row clickedRow)
        {
            CurrentRow = clickedRow;
            UpdateFields();
        }

        public void UpdateFields()
        {
            OnPropertyChanged(nameof(CurrentRow));
            OnPropertyChanged();
            OnPropertyChanged("");
            OnPropertyChanged(nameof(IsNewRow));
            OnPropertyChanged("IsNewRow");
        }
    }
}

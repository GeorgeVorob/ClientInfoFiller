﻿using ClientInfoFiller.Models;
using ClientInfoFiller.Services;
using ReactiveUI;
using System.Collections.ObjectModel;
using System.IO;
using System;
using System.Linq;
using System.Windows.Documents;
using System.Collections.Generic;
using AvaloniaEdit.Utils;

namespace ClientInfoFiller.ViewModels
{
    public class MainWindowViewModel : ViewModelBase
    {
        /// <summary>
        /// Путь к файлу, который хранить путь к основной таблице.
        /// Это не трогать, впредь юзать <see cref="ConfigInfo"/>
        /// </summary>
        private const string MainExcelStorageName = @"FilepathStorage.txt";

        private string _mainExcelFilePath = "";
        public string MainExcelFilePath
        {
            get => _mainExcelFilePath;
            set
            {
                this.RaiseAndSetIfChanged(ref _mainExcelFilePath, value);
                CanAccessMainExcelFile = !String.IsNullOrEmpty(MainExcelFilePath);

                if (CanAccessMainExcelFile)
                {
                    File.WriteAllText(MainExcelStorageName, value);
                    UpdateAutocompleteData();
                    UpdateFields();
                }
            }
        }

        private bool _canAccesMainExcelFile;
        public bool CanAccessMainExcelFile
        {
            get => _canAccesMainExcelFile;
            set => this.RaiseAndSetIfChanged(ref _canAccesMainExcelFile, value);
        }   

        private Row _currentRow;
        public Row CurrentRow
        {
            get => _currentRow;
            set
            {
                if (value == null)
                {
                    // dude why
                    return;
                }
                _currentRow = value;
                UpdateFields();
            }
        }

        public string FormPrice
        {
            set
            {
                int safeVal = !String.IsNullOrEmpty(value) ? Int32.Parse(value) : 0;
                CurrentRow.Price = safeVal;
                UpdateFields();
            }

            get
            {
                if (CurrentRow.Price == 0) return "";
                return CurrentRow.Price.ToString();
            }
        }

        public string FormPrepaymentCash
        {
            set
            {
                int safeVal = !String.IsNullOrEmpty(value) ? Int32.Parse(value) : 0;
                CurrentRow.PrepaymentCash = safeVal;
                UpdateFields();
            }

            get
            {
                if (CurrentRow.PrepaymentCash == 0) return "";
                return CurrentRow.PrepaymentCash.ToString();
            }
        }


        public string FormPrepaymentDigital
        {
            set
            {
                int safeVal = !String.IsNullOrEmpty(value) ? Int32.Parse(value) : 0;
                CurrentRow.PrepaymentDigital = safeVal;
                UpdateFields();
            }

            get
            {
                if (CurrentRow.PrepaymentDigital == 0) return "";
                return CurrentRow.PrepaymentDigital.ToString();
            }
        }

        public string FormPledgeCash
        {
            set
            {
                int safeVal = !String.IsNullOrEmpty(value) ? Int32.Parse(value) : 0;
                CurrentRow.PledgeCash = safeVal;
                UpdateFields();
            }

            get
            {
                if (CurrentRow.PledgeCash == 0) return "";
                return CurrentRow.PledgeCash.ToString();
            }
        }
        public string FormPledgeDigital
        {
            set
            {
                int safeVal = !String.IsNullOrEmpty(value) ? Int32.Parse(value) : 0;
                CurrentRow.PledgeDigital = safeVal;
                UpdateFields();
            }

            get
            {
                if (CurrentRow.PledgeDigital == 0) return "";
                return CurrentRow.PledgeDigital.ToString();
            }
        }

        public ObservableCollection<string> PhoneAutoCompleteData = new();
        public ObservableCollection<string> CustomerNameAutoCompleteData = new();

        public int FormOwe => CurrentRow.Owe;
        public ObservableCollection<string> searchModesComboBoxData { get; } = new();

        private string _selectedSearchMode;
        public string SelectedSearchMode
        {
            get => _selectedSearchMode;
            set => this.RaiseAndSetIfChanged(ref _selectedSearchMode, value);
        }

        private string _searchValue = "";
        public string SearchValue
        {
            get => _searchValue;
            set => this.RaiseAndSetIfChanged(ref _searchValue, value);
        }

        public ObservableCollection<Row> FoundRows { get; } = new();

        public bool IsNewRow => CurrentRow.RowPos == -1;

        public MainWindowViewModel()
        {
            _currentRow = new Row();
            searchModesComboBoxData.Add("По ФИО");
            searchModesComboBoxData.Add("По номеру телефона");
            searchModesComboBoxData.Add("По костюму");
            searchModesComboBoxData.Add("По номеру записи");
            _selectedSearchMode = searchModesComboBoxData[0];

            if (File.Exists(MainExcelStorageName))
            {
                string storedFilepath = File.ReadAllText(MainExcelStorageName);

                if (File.Exists(storedFilepath))
                {
                    this.MainExcelFilePath = storedFilepath;
                }
            }

            UpdateFields();
        }
        public void OnRowSaveClick(bool printUpdated = false)
        {
            if (MainExcelFilePath == null) throw new Exception("Пожалуйста, укажите путь к файлу таблицы.");

            ExcelService excel = new ExcelService(new FileInfo(MainExcelFilePath));
            WordService word = new WordService();

            bool isRowNew = CurrentRow.RowPos == -1;
            excel.SaveRow(this.CurrentRow);
            UpdateAutocompleteData();
            if (isRowNew || printUpdated)
            {
                word.FillAndPrint(this.CurrentRow);

                if(IsNewRow)
                    this.CurrentRow = new Row();
            }

            UpdateFields();
        }   

        public void OnSearchClick()
        {
            if (MainExcelFilePath == null) throw new Exception("Пожалуйста, укажите путь к файлу таблицы.");


            ExcelService excel = new ExcelService(new FileInfo(MainExcelFilePath));
            FoundRows.Clear();
            SearchModes searchMode = SearchModes.ByID;

            switch (SelectedSearchMode)
            {
                case "По номеру записи": searchMode = SearchModes.ByID; break;
                case "По ФИО": searchMode = SearchModes.ByCustomerName; break;
                case "По номеру телефона": searchMode = SearchModes.ByProhe; break;
                case "По костюму": searchMode = SearchModes.ByCostumeName; break;
            }

            foreach (Row row in excel.SearchRow(searchMode, SearchValue, 20))
            {
                FoundRows.Add(row);
            }

        }

        public void ResetCurrentRow() => CurrentRow = new Row();

        private void UpdateAutocompleteData()
        {
            var excel = new ExcelService(new FileInfo(MainExcelFilePath));
            var lastRows = excel.SearchRow(SearchModes.ByCustomerName, "", int.MaxValue);

            CustomerNameAutoCompleteData.Clear();
            CustomerNameAutoCompleteData.AddRange(
                lastRows.GroupBy(r => r.CustomerName.ToLower()).Select(x => x.First())
                .Select(row => row.CustomerName).Distinct().ToList()
                );

            PhoneAutoCompleteData.Clear();
            PhoneAutoCompleteData.AddRange(lastRows.Select(row => row.Phone).Distinct().ToList());
        }

        public void UpdateFields()
        {
            this.RaisePropertyChanged(nameof(CurrentRow));
            this.RaisePropertyChanged();
            this.RaisePropertyChanged("");
            this.RaisePropertyChanged(nameof(IsNewRow));
            this.RaisePropertyChanged("IsNewRow");
            this.RaisePropertyChanged(nameof(SelectedSearchMode));
            this.RaisePropertyChanged(nameof(FoundRows));
            this.RaisePropertyChanged(nameof(FormOwe));
        }
    }
}
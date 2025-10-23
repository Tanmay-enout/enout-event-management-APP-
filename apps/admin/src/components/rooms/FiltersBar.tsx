'use client';

import { useState, useEffect } from 'react';
import { Search, Filter } from 'lucide-react';
import { cn } from '@/lib/utils';

export interface RoomFilters {
  status: string[];
  category: string;
  search: string;
  sort: string;
  page: number;
  pageSize: number;
}

interface FiltersBarProps {
  filters: RoomFilters;
  onFiltersChange: (filters: RoomFilters) => void;
  totalCount: number;
  categories: string[];
}

export function FiltersBar({ filters, onFiltersChange, totalCount, categories }: FiltersBarProps) {
  const [searchValue, setSearchValue] = useState(filters.search);

  // Debounce search input
  useEffect(() => {
    const timer = setTimeout(() => {
      if (searchValue !== filters.search) {
        onFiltersChange({ ...filters, search: searchValue, page: 1 });
      }
    }, 300);

    return () => clearTimeout(timer);
  }, [searchValue, filters, onFiltersChange]);

  const statusOptions = [
    { value: 'empty', label: 'Empty', color: 'bg-gray-100 text-gray-700' },
    { value: 'partial', label: 'Partial', color: 'bg-amber-100 text-amber-700' },
    { value: 'full', label: 'Full', color: 'bg-green-100 text-green-700' },
  ];

  const sortOptions = [
    { value: 'newest', label: 'Newest' },
    { value: 'room-asc', label: 'Room (A-Z)' },
    { value: 'room-desc', label: 'Room (Z-A)' },
    { value: 'status', label: 'Status' },
  ];

  const pageSizeOptions = [10, 25, 50, 100];

  const handleStatusToggle = (status: string) => {
    const newStatus = filters.status.includes(status)
      ? filters.status.filter(s => s !== status)
      : [...filters.status, status];
    onFiltersChange({ ...filters, status: newStatus, page: 1 });
  };

  const handleCategoryChange = (category: string) => {
    onFiltersChange({ ...filters, category, page: 1 });
  };

  const handleSortChange = (sort: string) => {
    onFiltersChange({ ...filters, sort, page: 1 });
  };

  const handlePageSizeChange = (pageSize: number) => {
    onFiltersChange({ ...filters, pageSize, page: 1 });
  };

  const totalPages = Math.ceil(totalCount / filters.pageSize);

  return (
    <div className="space-y-4">
      {/* Main Filters Row */}
      <div className="flex flex-col lg:flex-row gap-4">
        {/* Search */}
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
          <input
            type="text"
            placeholder="Search rooms or guests..."
            value={searchValue}
            onChange={(e) => setSearchValue(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
          />
        </div>

        {/* Status Filters */}
        <div className="flex flex-wrap gap-2">
          {statusOptions.map((option) => (
            <button
              key={option.value}
              onClick={() => handleStatusToggle(option.value)}
              className={cn(
                'px-3 py-1 text-sm rounded-full border transition-colors',
                filters.status.includes(option.value)
                  ? `${option.color} border-current`
                  : 'bg-white text-gray-600 border-gray-300 hover:bg-gray-50'
              )}
            >
              {option.label}
            </button>
          ))}
        </div>
      </div>

      {/* Secondary Filters Row */}
      <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center">
        {/* Category Filter */}
        <div className="flex items-center gap-2">
          <Filter className="h-4 w-4 text-gray-500" />
          <select
            value={filters.category}
            onChange={(e) => handleCategoryChange(e.target.value)}
            className="px-3 py-1 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
          >
            <option value="">All Categories</option>
            {categories.map((category) => (
              <option key={category} value={category}>
                {category}
              </option>
            ))}
          </select>
        </div>

        {/* Sort */}
        <div className="flex items-center gap-2">
          <span className="text-sm text-gray-600">Sort:</span>
          <select
            value={filters.sort}
            onChange={(e) => handleSortChange(e.target.value)}
            className="px-3 py-1 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
          >
            {sortOptions.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </div>

        {/* Page Size */}
        <div className="flex items-center gap-2">
          <span className="text-sm text-gray-600">Show:</span>
          <select
            value={filters.pageSize}
            onChange={(e) => handlePageSizeChange(Number(e.target.value))}
            className="px-3 py-1 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
          >
            {pageSizeOptions.map((size) => (
              <option key={size} value={size}>
                {size}
              </option>
            ))}
          </select>
        </div>

        {/* Results Count */}
        <div className="text-sm text-gray-500 ml-auto">
          {totalCount} rooms found
        </div>
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between">
          <div className="text-sm text-gray-500">
            Page {filters.page} of {totalPages}
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => onFiltersChange({ ...filters, page: Math.max(1, filters.page - 1) })}
              disabled={filters.page === 1}
              className="px-3 py-1 text-sm border border-gray-300 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
            >
              Previous
            </button>
            <button
              onClick={() => onFiltersChange({ ...filters, page: Math.min(totalPages, filters.page + 1) })}
              disabled={filters.page === totalPages}
              className="px-3 py-1 text-sm border border-gray-300 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
            >
              Next
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
